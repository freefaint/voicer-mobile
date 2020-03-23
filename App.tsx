// Libs
import React from 'react';

import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Button,
  Image,
  ScrollViewProperties,
  ScrollResponderEvent,
} from 'react-native';

import Axios from 'axios';

import Sound from 'react-native-sound';
import RNFS from "react-native-fs";
import Share from 'react-native-share';

Sound.setCategory('Playback');

interface IState { text?: string, wait?: string, audio?: string, error?: string };

export class App extends React.Component<{}, IState> {
  public state: IState = {};

  public componentDidMount() {
    setInterval(this.handleLoad, 2000);
  }

  public render() {
    return (
      <>
        <View style={{padding: 60, backgroundColor: '#fff', flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, alignSelf: 'center' }}>КОЖАНЫЕ МЕШКИ</Text>
            <Image style={{ width: 320, height: 240, alignSelf: 'center' }} source={{ uri: 'https://naukatehnika.com/files/journal/nauka/Burdina/20.04.19-robotyi-gruzovik-tashhili/spotmini%E2%80%93mladshij-brat.jpg' }} />
            
            <TextInput
              style={{ flexGrow: 1, textAlignVertical: 'top', borderWidth: 1, borderRadius: 4, borderColor: '#aaa', backgroundColor: '#fff', marginBottom: 20 }}
              multiline={true}
              placeholder="Текст"
              editable={!this.state.audio && !this.state.wait}
              onChangeText={text => this.setState({ text })}
              value={this.state.text}
            />

            {this.state.audio && (
              <>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flexGrow: 1 }}><Button onPress={this.handlePlay} title="Играть" /></View>
                  <View style={{ flexGrow: 1 }}><Button onPress={this.handleShare} title="Поделиться" /></View>
                  <View style={{ flexGrow: 1 }}><Button onPress={this.handleClear} title="Очистить" /></View>
                </View>
              </>
            )}

            {!this.state.audio && (
              <>
                {this.state.error && (
                  <Text>{this.state.error}</Text>
                )}
                
                {!this.state.wait && (
                  <Button disabled={!this.state.text} title="Голос" onPress={() => !!this.state.text && this.handleGo(this.state.text)} />
                )}

                {this.state.wait && (
                  <Text style={{ fontSize: 24, alignSelf: 'center' }}>Генерируем голос...</Text>
                )}
              </>
            )}
          </View>
        </View>
      </>
    );
  }

  private handlePlay = () => {
    var whoosh = new Sound(this.state.audio, '', (error) => {
      if (error) {
          console.log('failed to load the sound', error);
          return;
      }
      // loaded successfully
      console.log('duration in seconds: ' + whoosh.getDuration() + 'number of channels: ' + whoosh.getNumberOfChannels());

      if (whoosh.isLoaded()) {
        console.log('LOADED');
      } else {
        console.log('NOT LOADED');
      }

      // Play the sound with an onEnd callback
      whoosh.play((success) => {
        if (success) {
          console.log('successfully finished playing');
        } else {
          console.log('playback failed due to audio decoding errors');
        }
      });
    });
  }

  private handleShare = () => {
    console.log('try share', this.state.audio);

    if (!this.state.audio) {
      return;
    }

    RNFS.readFile(this.state.audio, 'base64').then(file => {
      console.log(file);

      Share.open({ url: "data:audio/mpeg;base64," + file, title: "Отправить голос", message: "Выберите, кому хотите отправить голос" })
        .then((res) => { console.log('shared', res) })
        .catch((err) => { err && console.log('share error', err); });
    });

    
  }

  private handleClear = () => {
    this.setState({ audio: undefined, text: undefined });
  }

  private handleLoad = () => {
    if (!this.state.wait) {
      return;
    }
    
    Axios.get('http://freefaint.ru/files/' + this.state.wait).then(response => {
      console.log('ready');

      const downloadDest = RNFS.DocumentDirectoryPath + '/sample.mp3';
      const ret = RNFS.downloadFile({
        fromUrl: 'http://freefaint.ru/files/' + this.state.wait,
        toFile: downloadDest
      });

      ret.promise.then(res => {
        console.log('ok', downloadDest);

        this.setState({ wait: undefined, audio: downloadDest });
      }).catch(err => {
        console.log(err);
      });
    }).catch(() => {
      console.log('early');
    });
  }

  private handleGo = (text: string) => {
    Axios.post('http://freefaint.ru/api/v1/files', { text }).then(response => {
      this.setState({ wait: response.data, error: undefined })
    }).catch(err => {
      this.setState({ error: JSON.stringify(err) })
    });
  }
}

export default App;
