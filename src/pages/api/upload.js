// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getRawBody from 'raw-body';
import contentType from 'content-type';
import formidable from 'formidable';
import { Image, createCanvas, loadImage } from 'canvas';
import Jimp from 'jimp';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import { drawText } from '@/utils';
import { storage } from '@/firebase';
import * as fs from 'fs';

const srcToFile = (src) => fs.readFileSync(src);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: false, maxFileSize: 2 * 1024 * 1024 });
    const formData = new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          reject('error');
        }
        resolve({ fields, files });
      });
    });
    const { fields, files } = await formData;
    // Configure
    const avatarX = 165;
    const avatarY = 407;
    const avatarSize = 463;
    const maxWidthText = 980;
    const maxHeightText = 920;
    const textX = 840;
    const textY = 480;
    const maxWidthFullName = 442;
    const maxHeightFullName = 71;
    const fullNameX = 177;
    const fullNameY = 910;
    const maxWidthRole = 527;
    const maxHeightRole = 56;
    const roleX = 139;
    const roleY = 980;
    const background = await loadImage('./src/storage/background.png');
    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');
    const avatarImage = new Image();
    const fonts = {
      sm: '30px "RobotoBold"',
      md: '40px "RobotoBold"',
      lg: '50px "RobotoBold"',
    };

    // Form data
    const text = fields.text || 'Thông điệp của bạn...';
    const fullName = fields.full_name || 'Tên của bạn...';
    const role = fields.role || 'Vai trò của bạn...';
    const font = text.length <= 300 ? fonts.lg : fonts.md;
    const fullNameFont =
      fullName.length <= 14 ? fonts.lg : fullName.length <= 18 ? fonts.md : fonts.sm;
    const roleFont = fullName.length <= 14 ? fonts.lg : fullName.length <= 18 ? fonts.md : fonts.sm;

    let avatar = null;
    try {
      avatar = await Jimp.read(fs.readFileSync(files.avatar.filepath));
      avatar.cover(avatarSize, avatarSize);
      avatar.circle(10000);
      avatar.crop(0, 0, avatarSize, avatarSize - 36);
    } catch (error) {
      console.log(error);
    }

    ctx.drawImage(background, 0, 0);
    if (avatar) {
      avatarImage.src = await avatar.getBufferAsync(Jimp.MIME_PNG);
      ctx.drawImage(avatarImage, avatarX, avatarY);
    }

    ctx.fillStyle = '#121f75';
    ctx.font = font;
    drawText(ctx, text, textX, textY, maxWidthText, maxHeightText);

    ctx.fillStyle = 'transparent';
    ctx.fillRect(fullNameX, fullNameY, maxWidthFullName, maxHeightFullName);

    ctx.font = fullNameFont;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'center';
    ctx.fillText(fullName, fullNameX + maxWidthFullName / 2, fullNameY);

    ctx.fillStyle = 'transparent';
    ctx.fillRect(roleX, roleY, maxWidthRole, maxHeightRole);

    ctx.font = roleFont;
    ctx.fillStyle = '#121f75';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'center';
    ctx.fillText(role, roleX + maxWidthRole / 2, roleY);

    const imageRef = ref(storage, 'images/' + files.avatar.newFilename + '.jpg');
    const compressedImage = await imagemin.buffer(canvas.toBuffer(), {
      plugins: [
        imageminMozjpeg({
          quality: 50,
          progressive: true, // Enable progressive rendering
          fastCrush: true, // Use fast DCT methods (less accurate but faster)
        }),
      ],
    });
    const snapshot = await uploadBytes(imageRef, compressedImage, {
      contentType: 'image/jpeg',
    });

    const url = await getDownloadURL(imageRef);

    res.status(200).json({
      url: url,
    });
  } else {
    // Handle any other HTTP method
    res.status(200).json({ message: 'Upload here' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
