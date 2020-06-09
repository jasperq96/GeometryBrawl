var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../index');
var should = chai.should();

chai.use(chaiHttp);

describe('Tests', function() {
    it('should go though', function(done) {
        chai.request(server)
            .get('/home')
            .end(function(err,res){
                res.should.have.status(200);
                done();
            });
    });

    it('yes', function(done) {
        chai.request(server)
            .get('/logout')
            .end(function(err,res){
                res.should.have.status(200);
            });
    });
});

describe('Test2', function() {
    var num = 9;
    it('test number', function(){
        assert.isNumber(num);
    });

});
