const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  // Note: For this beginner prototype, plaintext password comparison is used per requirements,
  // clearly isolated so bcrypt hashing can easily be swapped in for production.
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters']
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Helper method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return this.password === candidatePassword;
};

// Return safe user object (without password)
userSchema.methods.toSafeObject = function() {
  return {
    _id: this._id,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
