const chai = require('chai');
const chaiHttp = require('chai-http');

const {app, runServer, closeServer} = require('../server');

const expect = chai.expect;

chai.use(chaiHttp);


describe('Shopping List', function() {

  // Before our tests run, we activate the server. Our `runServer`
  // function returns a promise, and we return the that promise by
  // doing `return runServer`. If we didn't return a promise here,
  // there's a possibility of a race condition where our tests start
  // running before our server has started.
  before(function() {
    return runServer();
  });

  // although we only have one test module at the moment, we'll
  // close our server at the end of these tests. Otherwise,
  // if we add another test module that also has a `before` block
  // that starts our server, it will cause an error because the
  // server would still be running from the previous tests.
  after(function() {
    return closeServer();
  });

  // test strategy:
  //   1. make request to `/shopping-list`
  //   2. inspect response object and prove has right code and have
  //   right keys in response object.
  it('should list items on GET', function() {
    // for Mocha tests, when we're dealing with asynchronous operations,
    // we must either return a Promise object or else call a `done` callback
    // at the end of the test. The `chai.request(server).get...` call is asynchronous
    // and returns a Promise, so we just return it.
    return chai.request(app)
      .get('/shopping-list')
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('array');

        // because we create three items on app load
        expect(res.body.length).to.be.at.least(1);
        // each item should be an object with key/value pairs
        // for `id`, `name` and `checked`.
        const expectedKeys = ['id', 'name', 'checked'];
        res.body.forEach(function(item) {
          expect(item).to.be.a('object');
          expect(item).to.include.keys(expectedKeys);
        });
      });
  });


  // test strategy:
  //  1. make a POST request with data for a new item
  //  2. inspect response object and prove it has right
  //  status code and that the returned object has an `id`
  it('should add an item on POST', function() {
    const newItem = {name: 'coffee', checked: false};
    return chai.request(app)
      .post('/shopping-list')
      .send(newItem)
      .then(function(res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.include.keys('id', 'name', 'checked');
        expect(res.body.id).to.not.equal(null);
        // response should be deep equal to `newItem` from above if we assign
        // `id` to it from `res.body.id`
        expect(res.body).to.deep.equal(Object.assign(newItem, {id: res.body.id}));
      });
  });

  // test strategy:
  //  1. initialize some update data (we won't have an `id` yet)
  //  2. make a GET request so we can get an item to update
  //  3. add the `id` to `updateData`
  //  4. Make a PUT request with `updateData`
  //  5. Inspect the response object to ensure it
  //  has right status code and that we get back an updated
  //  item with the right data in it.
  it('should update items on PUT', function() {
    // we initialize our updateData here and then after the initial
    // request to the app, we update it with an `id` property so
    // we can make a second, PUT call to the app.
    const updateData = {
      name: 'foo',
      checked: true
    };

    return chai.request(app)
      // first have to get so we have an idea of object to update
      .get('/shopping-list')
      .then(function(res) {
        updateData.id = res.body[0].id;
        // this will return a promise whose value will be the response
        // object, which we can inspect in the next `then` block. Note
        // that we could have used a nested callback here instead of
        // returning a promise and chaining with `then`, but we find
        // this approach cleaner and easier to read and reason about.
        return chai.request(app)
          .put(`/shopping-list/${updateData.id}`)
          .send(updateData);
      })
      // prove that the PUT request has right status code
      // and returns updated item
      .then(function(res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a('object');
        expect(res.body).to.deep.equal(updateData);
      });
  });

  // test strategy:
  //  1. GET shopping list items so we can get ID of one
  //  to delete.
  //  2. DELETE an item and ensure we get back a status 204
  it('should delete items on DELETE', function() {
    return chai.request(app)
      // first have to get so we have an `id` of item
      // to delete
      .get('/shopping-list')
      .then(function(res) {
        return chai.request(app)
          .delete(`/shopping-list/${res.body[0].id}`);
      })
      .then(function(res) {
        expect(res).to.have.status(204);
      });
  });
});


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
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
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