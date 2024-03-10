import axios from 'axios';
import prompts from 'prompts';
import * as stream from 'stream';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import ProgressBar from 'progress';

// prompts.override(require('yargs').argv);

export function getAryLinks() {
  return [
    { 
      title: 'KUbuntu 22.04.4 (x64)', 
      value: 'https://cdimage.ubuntu.com/kubuntu/releases/22.04.4/release/kubuntu-22.04.4-desktop-amd64.iso', 
      name: 'kubuntu-22.04.4-desktop-amd64.iso' 
    },
    { 
      title: 'Linux Mint (Cinnamon) (x64)', 
      value: 'https://mirrors.cicku.me/linuxmint/iso/stable/21.3/linuxmint-21.3-cinnamon-64bit.iso',
      name: 'linuxmint-21.3-cinnamon-64bit.iso' 
    },
    { 
      title: 'Manjaro KDE 23.1.3 (x64)', 
      value: 'https://download.manjaro.org/kde/23.1.3/manjaro-kde-23.1.3-240113-linux66.iso',
      name: 'manjaro-kde-23.1.3-240113-linux66.iso' 
    }
  ];
}

export async function doDownload(fileUrl, fileName, title) {
  try {
    console.log("Downloading " + title + "...");

    const { data, headers } = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const progressBar = new ProgressBar('-> downloading [:bar] :percent :etas', {
      width: 40,
      complete: '=',
      incomplete: ' ',
      renderThrottle: 1,
      total: parseInt(headers['content-length'])
    });

    const writer = fs.createWriteStream("files/" + fileName);

    data.on('data', (chunk) => progressBar.tick(chunk.length))
    data.pipe(writer);
  } catch (error) {
    console.error(error);
  }
}


export async function doAsk() {
  (async () => {
    const onSubmit = async (prompt, answer) => {
      await doDownload(prompt.choices[0].value, prompt.choices[0].name, prompt.choices[0].title);
    };
    
    const onCancel = prompt => {
      console.log('Bye!');
      return true;
    };

    await prompts([
      {
        type: 'multiselect',
        name: 'text',
        message: 'Select the OS',
        choices: getAryLinks(),
      },
      {
        type: 'confirm',
        name: 'value',
        message: 'Can you confirm?',
        initial: true
      }
    ], { onSubmit, onCancel });
  })();
}