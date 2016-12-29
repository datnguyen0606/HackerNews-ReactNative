
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  View,
  ListView,
  TouchableHighlight,
  ActivityIndicator,
  Text,
  Image,
  AsyncStorage,
  RefreshControl
} from 'react-native';

const WebPage = require('./WebPage');
const api = require('../src/api.js');
const moment = require('moment');
const TOTAL_NEWS_ITEMS = 20;


async function fetchNewData() {
  const TOP_STORIES_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const news_items = [];

  AsyncStorage.setItem('time', JSON.stringify({'last_cache': moment()}));
  const top_stories = await api(TOP_STORIES_URL);

  for(let i = 0; i < TOTAL_NEWS_ITEMS; i++) {
    let story_url = "https://hacker-news.firebaseio.com/v0/item/" + top_stories[i] + ".json";
    let story = await api(story_url);
    news_items.push(story);
  }
  AsyncStorage.setItem('news_items', JSON.stringify(news_items));
  return news_items
}

async function fetchData() {
  const news_items_str = await AsyncStorage.getItem('news_items');
  let news_items = JSON.parse(news_items_str);
  if (news_items != null) {
    const time_str = await AsyncStorage.getItem('time');
    const time = JSON.parse(time_str);
    const last_cache = time.last_cache;
    const current_datetime = moment();
    const diff_hours = current_datetime.diff(last_cache, 'hours');
    if (diff_hours > 0) {
      news_items = null; // cache expired after 1 hour
    }
  }

  if (news_items == null) {
    news_items = await fetchNewData();
  }

  return news_items;
}


class NewsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({rowHasChanged: (row1, row2) => row1 != row2}),
      news: {},
      is_loaded: false,
      is_refreshing: false
    }
  }

  componentDidMount() {
    fetchData().then(news_items => {
      this.updateNewsUI(news_items);
    });
  }

  updateNewsUI(news_items) {
    const ds = this.state.dataSource.cloneWithRows(news_items);
    this.setState({
      news: ds,
      is_loaded: true
    });
  }

  _viewNews(url) {
    this.props.navigator.push({
      title: 'News Detail',
      component: WebPage,
      passProps: {url: url, type: 'news'},
      // tintColor: '#009688'
    });
  }

  _viewComment(id) {
    this.props.navigator.push({
      title: 'Comment',
      component: WebPage,
      passProps: {id: id, type: 'comment'},
      // tintColor: '#009688'
    });
  }

  _onRefresh() {
    this.setState({is_refreshing: true});
    fetchNewData().then(news_items => {
      this.updateNewsUI(news_items);
      this.setState({is_refreshing: false});
    });
  }

  renderRow(news, sectionID, rowID) {
    return (
      <View style={styles.rowContainer}>
        <View style={styles.infoContainer}>
          <TouchableHighlight
            underlayColor={"#E8E8E8"}
            onPress={this._viewNews.bind(this, news.url)}>
            <View>
              <Text style={styles.title}>{news.title}</Text>
              <View style={{flexDirection: 'row'}}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{`${news.score} points`}</Text>
                </View>
                <Text style={styles.info}>
                  {` by ${news.by} ${moment(news.time*1000).fromNow()}`}
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
        <View style={styles.commentContainer}>
          <TouchableHighlight
            underlayColor={"#E8E8E8"}
            onPress={this._viewComment.bind(this, news.id)}>
            <View>
              <Image source={require('../static/img/bubble.png')} />
              <Text style={{fontSize: 10}}>{`${news.descendants} comments`}</Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  }

  render() {
    const spinner = !this.state.is_loaded ?
      ( <ActivityIndicator
          size='large'/> ) :
      ( <View/>);

    return (
      <View style={styles.container}>
      {spinner}
      {
        this.state.is_loaded &&
        <ListView
          dataSource={this.state.news}
          renderRow={this.renderRow.bind(this)}
          refreshControl={
            <RefreshControl
              refreshing={this.state.is_refreshing}
              onRefresh={this._onRefresh.bind(this)} />
          } />
      }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 65
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  rowContainer: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 10
  },
  infoContainer: {
    flex: 3
  },
  commentContainer: {
    flex: 1
  },
  badge: {
    backgroundColor: '#dddddd',
    borderColor: '#dddddd',
    borderWidth: 4,
    borderRadius: 10
  },
  badgeText: {
    fontSize: 10
  },
  title: {
    fontWeight: 'bold',
    fontSize: 14
  },
  info: {
    fontSize: 12,
    marginTop: 3
  }
});


module.exports = NewsList;