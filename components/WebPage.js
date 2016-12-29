import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ActivityIndicator,
  WebView
} from 'react-native';

class WebPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      is_loaded: false
    }
  }

  _onNavigationStateChange(navState) {
    // if(!navState.loading){
    //   this.setState({
    //     is_loaded: true
    //   });
    // }
  }

  render() {
    let uri = '';
    if (this.props.type == 'news') {
      uri = this.props.url;
    } else {
      uri = `https://news.ycombinator.com/item?id=${this.props.id}`;
    }
    return (
      <WebView
        source={{uri: uri}}
        onNavigationStateChange={this._onNavigationStateChange.bind(this)} />
    );
  }
}

module.exports = WebPage;