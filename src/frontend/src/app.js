import React from 'react';
import ReactDOM from 'react-dom';

import './index.scss';

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      authorId: undefined,
      title: '',
      body: '',
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    window.MessengerExtensions.getContext(
      '1837286142961481', 
      (threadContext) => {
        let psid = threadContext.psid;
        this.setState({
          authorId: psid,
        });
      },
      (err) => {
        this.setState({
          notInMessenger: true,
        });
      }
    );
  }

  handleSubmit(event) {
    fetch('post', {
      method: 'POST',
      body: JSON.stringify(this.state),
      headers: {
        'Content-type': 'application/json'
      }
    })
    .then((response) => {
      window.MessengerExtensions.requestCloseBrowser(
        () => {/* webview closed */},
        (err) => { /* an error occurred */}
      );
    })
  }

  render() {
    if (this.state.notInMessenger) {
      return (
        <div className="content">
          {/* <div className="header">
            Voice
          </div> */}

          <div className="error">
            <div>Please use the Android or iOS Facebook Messenger app!</div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="body">
          <div className="header">
            <h3>Please write your post below</h3>
          </div>
          <div className="content">
            <div>
              <input id="title" type="text" value={this.state.title} onChange={(event) => {
                this.setState({title: event.target.value});
              }} placeholder="Your title" />
            </div>
            <div>
              <textarea id="body" value={this.state.body} rows="15" onChange={(event) => {
                this.setState({body: event.target.value});
              }} placeholder="Your post" />
            </div>
            <div>
              <button id="submit" onClick={this.handleSubmit}>
                Done
              </button>
            </div>
          </div>
        </div>
      );
    }
  }
}

window.extAsyncInit = () => {
  ReactDOM.render(
    React.createElement(App),
    document.getElementById('voice-app')
  );
};
