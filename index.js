const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
app.use(cors())
app.use(express.static('public'))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const bodyparser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://junior:1234@cluster0.cfk7onz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));


app.use(bodyparser.urlencoded({extended:false}));
let absolutPath = __dirname + "/views/index.html";

// =========== Defining Mongoose Models =====================

const userSchema = new mongoose.Schema( {
   username: {type: String, required: true}
  });

  const exerciseSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    description: {type: String, required:true},
    duration: {type: Number, required: true},
    date: {type: Date, required: true}
  });

  const User = mongoose.model('User', userSchema);
  const Exercise = mongoose.model('Exercise', exerciseSchema);

  // ==================== Implementing API routes =========================
app.post('/api/users', async (req, res)=>{ //Create a new User
  try{
      const newUser = new User({username:req.body.username});
      await newUser.save();
      res.json({ username: newUser.username, _id: newUser._id });
  }catch(err){
    res.json({error: err.message});
  }
 
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}); // Find all users
    res.json(users); // Respond with the list of users as a JSON array
  } catch (err) {
    res.status(500).json({ error: err.message }); // Handle any errors
  }
});

//Add an Exetcise... whit the user id

// POST /api/users/:_id/exercises - Add an exercise to a user
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new exercise object
    const exercise = new Exercise({
      userId: user._id,
      description: description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date()
    });

    // Save the exercise to the database
    await exercise.save();

    // Respond with the user object along with the exercise details
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/users/:_id/logs - Retrieve a user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
      const { from, to, limit } = req.query;
      const userId = req.params._id;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      let query = { userId };
      if (from || to) {
          query.date = {};
          if (from) query.date.$gte = new Date(from);
          if (to) query.date.$lte = new Date(to);
      }

      let exercises = await Exercise.find(query).limit(parseInt(limit) || 0);

      exercises = exercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
      }));

      res.json({
          _id: user._id,
          username: user.username,
          count: exercises.length,
          log: exercises
      });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

/*app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
}); */



module.exports = {User, Exercise};



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
