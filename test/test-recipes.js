const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp);

const {app, runServer, closeServer} = require('../server.js')
const expect = chai.expect;
const should = chai.should();


describe('Recipes', function(){
  before(()=>{
    return runServer()
  });
  after(()=>{
    return closeServer()
  });

  it('should retrieve all recipes on GET', function(){
    return chai.request(app)
      .get('/recipes')
      .then(function(res){
        res.should.have.status(200);
        expect(res).to.be.json;
        res.body.should.be.an('array');
        expect(res.body.length).to.be.at.least(2, 'amount of recipes');
        const expectedKeys = ['name', 'id', 'ingredients'];
        res.body.forEach(recipe=>{
          expect(recipe).to.include.keys(expectedKeys);
        })
      })
  });

  it('should POST a recipe', function(){
    const newRecipe = {name: 'PBJ supreme', ingredients: ['PB', 'J', 'Honey', 'Bread']};
    return chai.request(app)
      .post('/recipes')
      .send(newRecipe)
      .then(function(res){
        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        const expectedKeys = ['name', 'id', 'ingredients']
        expect(res.body).to.include.keys(expectedKeys)
        expect(res.body).to.deep.equal(Object.assign( newRecipe, {id: res.body.id} ))
      });
  });

  it('should update an item on PUT', function(){
    const updatedRecipe = {name: 'PBJ surprise', ingredients: ['Peanut Butter', 'Jelly', 'Sriracha', 'Bread']}
    return chai.request(app)
      .get('/recipes')
      .then(function(res){
        updatedRecipe.id = res.body[0].id;
        return chai.request(app)
          .put(`/recipes/${res.body[0].id}`)
          .send(updatedRecipe)
      })
      .then(function(res){
        expect(res).to.have.status(200)
        expect(res.body).to.be.an('object');
        expect(res.body).to.deep.equal(updatedRecipe)
      });
  });

  it('should delete an item', function(){
    let itemId = '';
    let beforeCount;
    let afterCount;
    return chai.request(app)
      .get('/recipes')
      .then(function(res){
        itemId = res.body[0].id;
        beforeCount = res.body.length; 
        return chai.request(app)
          .delete(`/recipes/${itemId}`)
      })
      .then(function(res){
        expect(res).to.have.status(204)
        return chai.request(app)
          .get('/recipes')
      })
      .then(function(res){
        expect(res.body).to.be.an('array');
        afterCount = res.body.length;
        console.log(`before: ${beforeCount}, after: ${afterCount}`)
        expect(beforeCount).to.equal(afterCount + 1, 'how many recipes left after deletion')
      })
  })
});