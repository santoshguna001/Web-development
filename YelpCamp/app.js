var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    Campground = require('./models/campground'),
    Comment = require('./models/comment'),
    passport = require('passport'),
    localStrategy = require('passport-local'),
    User = require('./models/user'),
    seedDB = require('./seeds');

seedDB();
mongoose.connect("mongodb://localhost:27017/YelpCamp", { useNewUrlParser: true, useUnifiedTopology: true });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

app.use(require('express-session')({
    secret: 'This is my secret key',
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

app.get('/', function(req, res) {
    res.render('landing');
});

app.get('/campgrounds', function(req, res) {

    Campground.find({}, function(err, campgrounds) {
        if (err) {
            console.log('Error');
        }
        res.render('campgrounds/index', { campgrounds: campgrounds });
    });
});

app.get('/campgrounds/new', function(req, res) {
    res.render('campgrounds/new');
});

app.post('/campgrounds', function(req, res) {
    Campground.create({
            name: req.body.name,
            image: req.body.image,
            description: req.body.description
        },
        function(err, campground) {
            if (err) {
                console.log(err);
            } else {
                res.redirect('campgrounds');
            }
        });
});

app.get("/campgrounds/:id", function(req, res) {
    Campground.findById(req.params.id.trim()).populate('comments').exec(function(err, campground) {
        if (err) {
            console.log('Error loading the given id' + req.params.id.trim());
        } else {
            console.log(campground);
            res.render('campgrounds/show', { campground: campground });
        }
    });
});
app.get('/campgrounds/:id/comments/new', isLoggedIn, function(req, res) {
    Campground.findById(req.params.id.trim(), function(err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render('comments/new', { campground: campground });
        }
    });
});
app.post('/campgrounds/:id/comments', isLoggedIn, function(req, res) {
    Campground.findById(req.params.id.trim(), function(err, campground) {
        if (err) {
            console.log(err);
            redirect('/campgrounds');
        } else {
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect('/campgrounds/' + campground._id);
                }
            })
        }
    })
});

app.get('/register', function(req, res) {
    res.render('register');
});
app.post('/register', function(req, res) {
    var newUser = new User({ username: req.body.username })
    User.register(newUser, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function() {
            res.redirect('/campgrounds');
        })
    });
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/campgrounds',
    failureRedirect: '/login'
}), function(req, res) {

});
app.get('/logout', function(req, res) {
    req.logOut();
    res.redirect('/campgrounds');
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.listen(3000, function() {
    console.log('YelpCamp server has started listening');
});