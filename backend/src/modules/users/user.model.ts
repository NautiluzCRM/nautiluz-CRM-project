import mongoose from 'mongoose';
import { hash, compare } from 'bcrypt';

const DistributionConfigSchema = new mongoose.Schema({
  active: { type: Boolean, default: true }, 
  
  minLives: { type: Number, default: 0 },   
  maxLives: { type: Number, default: 9999 }, 
  

  cnpjRule: { 
    type: String, 
    enum: ['required', 'forbidden', 'both'], 
    default: 'both' 
  },

  lastLeadReceivedAt: { type: Date, default: null } 
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'vendedor', 'gerente'], 
      default: 'vendedor' 
    },
    active: { type: Boolean, default: true },
    
    distribution: { 
      type: DistributionConfigSchema, 
      default: () => ({})
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await hash(this.passwordHash, 8);
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return compare(password, this.passwordHash);
};

export const UserModel = mongoose.model('User', userSchema);