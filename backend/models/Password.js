const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'your_jwt_secret_key_here', 'salt', 32);
const IV_LENGTH = 16;

const passwordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  favorite: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

function encrypt(text) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Error al encriptar:', error);
    throw error;
  }
}

function decrypt(text) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Formato de texto encriptado inválido');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Error al desencriptar:', error);
    return null;
  }
}

passwordSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = encrypt(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

passwordSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.password) {
    try {
      update.password = encrypt(update.password);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

passwordSchema.pre('findByIdAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.password) {
    try {
      update.password = encrypt(update.password);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

passwordSchema.methods.getDecryptedPassword = function() {
  try {
    return decrypt(this.password);
  } catch (error) {
    console.error('Error al desencriptar la contraseña:', error);
    return null;
  }
};

const Password = mongoose.model('Password', passwordSchema);

module.exports = Password;
