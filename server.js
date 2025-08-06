const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);

const app = express();
const PORT = 3000;

const instructorCredentials = {
  email: 'pedrampirdastan@gmail.com',
  password: '09351787117pP'
};

const usersFilePath = path.join(__dirname, 'users.json');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'src')));

app.use(session({
  store: new FileStore({ path: './sessions' }), // ذخیره سشن در فولدر sessions
  secret: 'secret-key-12345',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 3 } // 3 ساعت
}));

// خواندن کاربران از فایل
function readUsers() {
  if (!fs.existsSync(usersFilePath)) return [];
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data || '[]');
}

// نوشتن کاربران در فایل
function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

const emailRegex = /^[^\s@]+@gmail\.com$/i;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,20}$/;

// ثبت نام
app.post('/register', (req, res) => {
  const { fname, lname, karbari, email, password, passwordto } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).send('ایمیل معتبر نیست');
  }
  if (!password || !passwordRegex.test(password)) {
    return res.status(400).send('رمز عبور معتبر نیست');
  }
  if (password !== passwordto) {
    return res.status(400).send('تایید رمز عبور صحیح نیست');
  }

  let users = readUsers();

  if (users.find(u => u.email === email)) {
    return res.status(400).send('این ایمیل قبلا ثبت شده');
  }

  // ذخیره کاربر جدید
  users.push({ fname, lname, karbari, email, password });
  writeUsers(users);

  res.send('ثبت نام با موفقیت انجام شد. <a href="/login.html">ورود</a>');
});

// لاگین
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res.status(400).send('<h3>ایمیل باید معتبر و @gmail.com باشه!</h3><a href="/login.html">بازگشت</a>');
  }

  if (!password || !passwordRegex.test(password)) {
    return res.status(400).send('<h3>رمز عبور باید بین ۶ تا ۲۰ کاراکتر، شامل حرف بزرگ، کوچک و عدد باشه!</h3><a href="/login.html">بازگشت</a>');
  }

  const isInstructor = email === instructorCredentials.email && password === instructorCredentials.password;

  let users = readUsers();
  const studentExists = users.find(u => u.email === email && u.password === password);

  if (!isInstructor && !studentExists) {
    return res.status(401).send('<h3>کاربری با این ایمیل و رمز عبور ثبت نشده است!</h3><a href="/login.html">بازگشت</a>');
  }

  req.session.user = { email, isInstructor };

  console.log('🟢 ورود موفق:', { email, isInstructor });

  const indexPath = path.join(__dirname, 'src', 'index.html');

  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('❌ خطا در بارگذاری صفحه اصلی');

    let updatedHtml = data;

    if (isInstructor) {
      updatedHtml = data.replace(
        '<!--INSTRUCTOR_PANEL-->',
        '<a href="/panel.html" class="text-blue-600 underline">پنل مدیریت</a>'
      );
    } else {
      updatedHtml = data.replace('<!--INSTRUCTOR_PANEL-->', '');
    }

    res.send(updatedHtml);
  });
});

// پنل
app.get('/panel', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('<h3>ابتدا باید وارد شوید!</h3><a href="/login.html">ورود</a>');
  }

  if (req.session.user.isInstructor) {
    res.send('<h1>پنل مدیریت هنراموز</h1><p>خوش آمدید، ' + req.session.user.email + '</p>');
  } else {
    res.send('<h1>پنل کاربری هنرجو</h1><p>خوش آمدید، ' + req.session.user.email + '</p>');
  }
});

// خروج
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`✅ سرور اجرا شد روی http://localhost:${PORT}`);
});
