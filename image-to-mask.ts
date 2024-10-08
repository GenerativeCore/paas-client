import fs from 'fs';
import { generativeCore, delay } from './utils';
import { BASE_URL, AUTH } from './consts';

const request = {
  type: 'image-to-mask',
  payload: {
    image: fs.readFileSync('./for_dress.jpg').toString('base64'),
    prompt: 'clothes'
  }
};

// for debugging purposes
fs.writeFileSync('payloads/image-to-mask.json', JSON.stringify(request, null, '\t'));

const paas = generativeCore({ baseUrl: BASE_URL, auth: AUTH });

(async () => {
  try {
    const id = await paas.createTask(request);
    console.log(id);
    let task;
    let attempts = 0;
    do {
      await delay(1000);
      task = await paas.checkTask(id);
      console.log(attempts, task.status);
      if (attempts++ > 200) {
        throw new Error('Timeout');
      }
    } while (task.status === 'pending' || task.status === 'processing');
    if (task.status === 'completed') {
      console.log(task);
      const {mask} = task.results.data;
      let buffer = Buffer.from(mask.base64, 'base64');
      fs.writeFileSync(`images/image_to_mask${id}.png`, buffer);
    } else {
      console.log('task failed', task);
    }
  } catch (e: any) {
    console.log(e.response.data);
  } finally {
    process.exit(0);
  }
})();
