const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

 //#1
  test("Creating a new thread", (done)=>{
  chai.request(server)
  .post('/api/threads/test')
  .send({
    board: 'test',
    text: 'test thread',
    delete_password: 'deleteme'
  }).end((err, res)=>{
    assert.equal(res.status, 200); 
    done();
  });
  });

//#2
  test("Viewing the 10 most recent threads with 3 replies each", (done)=>{
    chai.request(server).get('/api/threads/fcc_test')
    .end((err,res)=>{
      assert.equal(res.status, 200); 
      assert.isAtMost(res.body.length, 10); 

    res.body.map((thread)=>{
      if(thread.replies.length != 0){
         assert.isAtMost(thread.replies.length, 3); 
      }
    });
    
    done();
    });
  });

//#3
  test("Deleting a thread with the incorrect password", (done)=>{
    chai.request(server).delete('/api/threads/fcc_test?delete_password=incorrect_pass&thread_id=60df80abd3452313e04eada1')
    .end((err,res)=>{    
      assert.equal(res.status, 200); 
      assert.equal(res.text, 'incorrect password'); 
      done(); 
    }); 
  });

 //#4
   test("Deleting a thread with the correct password", (done)=>{
     chai.request(server).get('/api/threads/test')
     .end((err, res)=>{
       //console.log(res.body[0]._id);
       chai.request(server).delete(`/api/threads/fcc_test?thread_id=${res.body[0]._id}&delete_password=deleteme`)
        .end((err2,res2)=>{
          assert.equal(res2.status, 200); 
          assert.equal(res2.text, 'success'); 
          done(); 
        });      
     });
  });

 //#5
  test('Reporting a thread', (done)=>{
     chai.request(server).get('/api/threads/fcc_test')
     .end((err, res)=>{
       if(err) throw(err); 
       chai.request(server).put('/api/threads/fcc_test')
        .send({
          'thread_id':res.body[0]._id
        })
        .end((err2,res2)=>{
          assert.equal(res2.status, 200); 
          assert.equal(res2.text, 'success'); 
          done(); 
        });      
     });
});

 //#6
  test('Creating a new reply', (done)=>{
    chai.request(server).get('/api/threads/fcc_test')
    .end((err, res)=>{
        chai.request(server).post('/api/replies/fcc_test')
      .send({
        text: 'test',
        delete_password: 'deleteme', 
        thread_id: res.body[0]._id,
        reported: false
      })
      .end((err,res)=>{
        assert.equal(res.status, 200); 
        done();
      });
    }); 
    
  });

 //#7
  test('Viewing a single thread with all replies',(done)=>{
    chai.request(server).get('/api/replies/fcc_test')
    .query({
      thread_id: "60df80abd3452313e04eada1"
    })
    .end((err, res)=>{
        assert.equal(res.status,200);
      done();
    });
  });

 //#8
  test('Deleting a reply with the incorrect password', (done)=>{
    chai.request(server).delete('/api/replies/fcc_test?thread_id=60df80abd3452313e04eada1&reply_id=60df82a0ad9013197961785c&delete_password=incorrect')
   .end((err, res)=>{
      assert.equal(res.status, 200); 
      assert.equal(res.text, "incorrect password");
      done();
    });
  });

 //#9
  test('Deleting a reply with the correct password', (done)=>{
    chai.request(server).delete('/api/replies/fcc_test?thread_id=60df80abd3452313e04eada1&reply_id=60df82a0ad9013197961785c&delete_password=delete_me')
    .end((err, res)=>{
      assert.equal(res.status, 200); 
      assert.equal(res.text, "success")
      done();
    });
  });

 //#10
  test('Reporting a reply', (done)=>{
    chai.request(server).put('/api/replies/fcc_test')
    .send({
      thread_id: '60df80abd3452313e04eada1',
      reply_id: '60df82a0ad9013197961785c'
    }).end((err, res)=>{
      assert.equal(res.status, 200); 
      assert.equal(res.text, "success"); 
      done();
    });
  });
});

