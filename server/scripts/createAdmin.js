require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');

const seedAdminAndData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/study_platform';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@studyplatform.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isActive: true
      });
      console.log(`[Seed] Created predefined admin account: ${adminEmail}`);
    } else {
      admin.password = adminPassword;
      admin.role = 'admin';
      admin.isActive = true;
      await admin.save();
      console.log(`[Seed] Predefined admin account confirmed: ${adminEmail}`);
    }

    // Check if initial sample courses exist; if not, create initial courses
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      console.log('[Seed] Seeding initial sample courses...');
      await Course.create([
        {
          title: 'JavaScript Modern Essentials',
          description: 'Master core JavaScript concepts including ES6+ syntax, asynchronous programming, DOM manipulation, and modern web development principles.',
          category: 'Web Development',
          thumbnailUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=600&q=80',
          videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
          status: 'Published',
          createdBy: admin._id
        },
        {
          title: 'Python for Beginners & Data Science',
          description: 'Learn Python from scratch: variables, data structures, loops, functions, and standard libraries for automation and practical data analysis.',
          category: 'Programming Languages',
          thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=600&q=80',
          videoUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
          status: 'Published',
          createdBy: admin._id
        },
        {
          title: 'React.js Component Architecture',
          description: 'Build modern interactive user interfaces with React.js, functional components, state management with Hooks, and responsive design patterns.',
          category: 'Frontend Frameworks',
          thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
          videoUrl: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8',
          status: 'Published',
          createdBy: admin._id
        },
        {
          title: 'HTML & CSS Responsive Web Design',
          description: 'Comprehensive guide to semantic HTML5, modern CSS flexbox and grid layouts, and mobile-friendly responsive web designs.',
          category: 'Web Development',
          thumbnailUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
          videoUrl: 'https://www.youtube.com/watch?v=G3e-cpL7ofc',
          status: 'Published',
          createdBy: admin._id
        }
      ]);
      console.log('[Seed] Sample courses created successfully.');
    }

    console.log('[Seed] Completed successfully.');
    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error]:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedAdminAndData();
}

module.exports = seedAdminAndData;
