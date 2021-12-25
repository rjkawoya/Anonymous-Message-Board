'use strict';

const expect = require('chai').expect;
const mongodb = require('mongodb');
const mongoose = require('mongoose');



module.exports = function (app) {

  let uri = process.env.DB
  mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

  let replySchema = new mongoose.Schema({
    text: {type: String, required: true},
    delete_password: {type: String, required: true},
    created_on: {type: Date, required: true},
    reported: {type: Boolean, required: true}
  });

  let threadSchema = new mongoose.Schema({
    text: {type: String, required: true},
    delete_password: {type: String, required: true},
    board: {type: String, required: true},
    created_on: {type: Date, required: true},
    bumped_on: {type: Date, required: true},
    reported: {type: Boolean, required: true},
    replies: [replySchema]
  });

  let Reply = mongoose.model('Reply', replySchema);
  let Thread = mongoose.model('Thread', threadSchema);
  
  app.post('/api/threads/:board', (req, res) => {
    let newThread = new Thread(req.body);
    
    if(!newThread.board || newThread.board === '') {
      newThread.board = req.params.board;
    }
    
    newThread.created_on = new Date().toUTCString();
    newThread.bumped_on = new Date().toUTCString();
    newThread.reported = false;
    newThread.replies = [];

    newThread.save((err, savedThread) => {
      if(!err && savedThread) {
        return res.redirect('/b/' + savedThread.board + '/' + savedThread.id);
      }
    });
  });
  
  app.post('/api/replies/:board', (req, res) => {
    let newReply = new Reply(req.body);
    newReply.created_on = new Date().toUTCString();
    newReply.reported = false;
    
    Thread.findByIdAndUpdate(
      req.body.thread_id,
      {$push: {replies: newReply}, bumped_on: new Date().toUTCString()},
      {new: true},
      (err, updatedThread) => {
        if(!err && updatedThread) {
          res.redirect('/b/'+ updatedThread.board + '/' + updatedThread.id + '?new_reply_id=' + newReply.id)
        }
      }
    );
  });

  app.get('/api/threads/:board', (req, res) => {

    Thread.find({board: req.params.board})
      .sort({bumped_on: 'desc'})
      .limit(10)
      .select()
      .lean()
      .exec((err, arrayOfThreads) => {
        if(!err && arrayOfThreads) {
          arrayOfThreads.forEach((thread) => {
            
            thread['replycount'] = thread.replies.length;

            thread.replies.sort((thread1, thread2) => {
              return thread2.created_on - thread1.created_on;
            });

            thread.replies = thread.replies.slice(0, 3);

            thread.replies.forEach((reply) => {
              reply.delete_password = undefined;
              reply.reported = undefined;
            });
          });
          return res.json(arrayOfThreads);
        }
      });
  });

  app.get('/api/replies/:board', (req, res) => {
    Thread.findById(
      req.query.thread_id,
      (err, thread) => {
        if(!err && thread) {
          thread.delete_password = undefined;
          thread.reported = undefined;

          thread.replies.sort((thread1, thread2) => {
            return thread2.created_on - thread1.created_on;
          });

          thread.replies.forEach((reply) => {
            reply.delete_password = undefined;
            reply.reported = undefined;
          });
          return res.json(thread);
        }
      }
    );
  });

  app.delete('/api/threads/:board', (req, res) => {
    Thread.findById(
      req.body.thread_id,
      (err, threadToDelete) => {
        if(!err && threadToDelete) {
          
          if(threadToDelete.delete_password === req.body.delete_password) {
            Thread.findByIdAndRemove(
              req.body.thread_id,
              (err, deletedThread) => {
                if(!err && deletedThread) {
                  return res.json('success');
                }
              }
            );
          } else {
            return res.json('incorrect password');
          }

        } else {
          return res.json('Thread not found');        }
      }
    );
  });

  app.delete('/api/replies/:board', (req, res) => {
    Thread.findById(
      req.body.thread_id,
      (err, threadToUpdate) => {
        if(!err && threadToUpdate) {

          for(let i = 0; i < threadToUpdate.replies.length; i++) {
            if(threadToUpdate.replies[i].id === req.body.reply_id) {
              if(threadToUpdate.replies[i].delete_password === req.body.delete_password) {
                threadToUpdate.replies[i].text = '[deleted]';
                
              } else {
                return res.json('incorrect password');
              }
            }
          }

          threadToUpdate.save((err, updatedThread) => {
            if(!err && updatedThread) {
              return res.json('success');
            }
          });

        } else {
          return res.json('Thread not found');
        }
      }
    );
  });

  app.put('/api/threads/:board', (req, res) => {
    Thread.findByIdAndUpdate(
      req.body.thread_id,
      {reported: true},
      {new: true},
      (err, updatedThread) => {
        if(!err && updatedThread) {
          return res.json('success');
        }
      }
    );
  });

  app.put('/api/replies/:board', (req, res) => {
    Thread.findById(
      req.body.thread_id,
      (err, threadToUpdate) => {
        if(!err && threadToUpdate) {

          for(let i = 0; i < threadToUpdate.replies.length; i++) {
            if(threadToUpdate.replies[i].id === req.body.reply_id) {
              threadToUpdate.replies[i].reported = true;
            }
          }

          threadToUpdate.save((err, updatedThread) => {
            if(!err && updatedThread) {
              return res.json('success');
            }
          });

        } else {
          return res.json('Thread not found');
        }
      }
    );
  });

  //app.route('/api/threads/:board');
    
  //app.route('/api/replies/:board');

};
