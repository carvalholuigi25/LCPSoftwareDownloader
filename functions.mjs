import axios from 'axios';
import prompts from 'prompts';
import * as stream from 'stream';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import ProgressBar from 'progress';
import { fileURLToPath } from 'url';

const __filenameNew = fileURLToPath(import.meta.url);
const __dirnameNew = path.dirname(__filenameNew);

export function getDataOS() {
  return JSON.parse(fs.readFileSync(path.resolve(__dirnameNew, "data_os.json"), 'utf8'));
}

export function getDataTools() {
  return JSON.parse(fs.readFileSync(path.resolve(__dirnameNew, "data_tools.json"), 'utf8'));
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

    const writer = fs.createWriteStream(path.resolve(__dirnameNew, "files", fileName));

    data.on('data', (chunk) => progressBar.tick(chunk.length));
    data.on('end', () => {
      console.log("Done downloading " + title + "!\r\nThe file is located at " + path.resolve(__dirnameNew, "files", fileName));
    });
    data.pipe(writer);
  } catch (error) {
    console.error(error);
  }
}


export async function doAsk() {
  const onSubmit = async (prompt, answer) => {
    if(prompt.choices.length > 0) {
      prompt.choices = prompt.choices.filter(x => x.value.includes(answer));
    }

    if (prompt.name == "osselect") {
      if (answer.length > 0) {
        await doDownload(prompt.choices[0].value, prompt.choices[0].name, prompt.choices[0].title);
      } else {
        console.log('You should select at least one operating system to download!');
      }
    } else if (prompt.name == "toolsselect") {
      if (answer.length > 0) {
        await doDownload(prompt.choices[0].value, prompt.choices[0].name, prompt.choices[0].title);
      } else {
        console.log('You should select at least one tool to download!');
      }
    } else {
      if (answer.length == 0) {
        console.log('You should select at least one of type software to proceed!');
      }
    }
  };

  const onCancel = (prompt) => {
    console.log("Cancelled");
    return;
  };

  const questions = [
    {
      type: 'select',
      name: 'typesoftselect',
      message: 'Select the type of software',
      choices: [
        {
          title: "Operating Systems",
          value: "opsystems",
          name: "opsystems"
        },
        {
          title: "Tools",
          value: "tools",
          name: "tools"
        }
      ]
    },
    {
      type: prev => prev == 'opsystems' ? 'select' : null,
      name: 'osselect',
      message: 'Select the operating system',
      choices: getDataOS()
    },
    {
      type: prev => prev == 'tools' ? 'select' : null,
      name: 'toolsselect',
      message: 'Select the tool',
      choices: getDataTools()
    }
  ];

  await prompts(questions, { onSubmit, onCancel });
}