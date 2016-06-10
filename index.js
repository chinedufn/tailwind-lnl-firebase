/**
 * This is a quick script to demonstrate real time chat in firebase
 * You wouldn't want to do everything in one file.. But we are for the sake of a quick Lunch and Learn
 *
 * I've tried to call attention to some of the bad practices that are used here for convenience.
 */

// This let's us connect to firebase :)
var firebase = require('firebase')
// This helps us efficiently update the real dom with our virtual-dom
var mainLoop = require('main-loop')
// This let's us have a nice virtual-dom in memory :)
var vdom = require('virtual-dom')
var h = vdom.h
// This gives us an immutable state object so that we don't accidentally overwrite our state while using it
var SS = require('solid-state')
// This generates a username because I was too lazy to give you the ability to do it yourself
var cuid = require('cuid')

// Initialize our application state object
var AppState = new SS({
  username: cuid(),
  beavers: 0,
  messages: {},
  pendingMessage: ''
})
// Initialize a connection to our Firebase database
firebase.initializeApp({
  apiKey: 'UmIGuessV2APINeedsAKeyButLikeWeDontReallyNeedOneSoYeah',
  // Our firebase database !!
  databaseURL: 'tailwind-lnl.firebaseio.com'
})
// Our firebase database handler
var database = firebase.database()

// Whenever there are new chat messages saved to the database, we'll get notified
// We will update our local messages in our state object
database.ref('chat').limitToLast(10).on('value', function (data) {
  AppState.set('messages', data.val() || {})
})

// We create a smart "loop" object that uses request animation frame to handle rendering.
// Everytime we call "loop.update" we will redraw our view
var loop = mainLoop(AppState.get(), render, vdom)

// Insert our application element into the dom
document.body.appendChild(loop.target)

// Whenever our state changes, update the application element
AppState.addListener(loop.update)

// Our pure render function that takes in our state and returns a virtual-dom
// Our loop.update function turns this virtual-dom into a real dom tree
function render (state) {
  return h('div', [
    createInput(state),
    sendMessageButton(state),
    createChatDiv(state)
  ])
}

// Create the input element
// NOTE!!! You don't want to stuff these all into one file!!!
function createInput (state) {
  return h('input', {
    oninput: function (e) {
      // NOTE!!! POOR PRACTICE!!! You typically want to emit an event to some external event emitter that knows about application state
      AppState.set('pendingMessage', e.target.value)
    },
    value: state.pendingMessage
  })
}

// Create a button to send messages to firebase
// NOTE!!! You don't want to stuff these all into one file!!!
function sendMessageButton (state) {
  return h('button', {
    onclick: function (e) {
      // NOTE!!! POOR PRACTICE!!! Emit an event to some higher up service that knows about persistence
      database.ref('chat').push({
        username: state.username,
        message: state.pendingMessage
      })
      // NOTE!!! POOR PRACTICE!!! You typically want to emit an event to some external event emitter that knows about application state
      AppState.set('pendingMessage', '')
    }
  })
}

// Create a div to hold all of our chat messages
// NOTE!!! You don't want to stuff these all into one file!!!
function createChatDiv (state) {
  // Loop through all of our messages that we synced from Firebase
  // We then build an array of virtual-dom chat elements. We use them below
  var chatMessages = Object.keys(state.messages).reduce(function (previous, currentKey) {
    return previous.concat([
      h('div', {
        style: { marginBottom: '5px' }
      }, [
        h('label', {
          style: { color: 'red' }
        }, state.messages[currentKey].username),
        ': ',
        h('span', state.messages[currentKey].message)
      ])
    ])
  }, [])

  // Ok Sweet! We have our chat elements. Toss them in a DIV and voila
  return h('div', {
    style: { overflowY: 'scroll' }
  }, chatMessages)
}
