const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ✅ مشخصات هنراموز (خودت)
const instructorCredentials = {
  email: 'pedrampirdastan@gmail.com',
  password: '09351787117pP'
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'src')));

const emailRegex = /^[^\s@]+@gmail\.com$/i;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,20}$/;

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !emailRegex.test(email)) {
    return res
      .status(400)
      .send('<h3>ایمیل باید معتبر و @gmail.com باشه!</h3><a href="/login.html">بازگشت</a>');
  }

  if (!password || !passwordRegex.test(password)) {
    return res
      .status(400)
      .send('<h3>رمز عبور باید بین ۶ تا ۲۰ کاراکتر، شامل حرف بزرگ، کوچک و عدد باشه!</h3><a href="/login.html">بازگشت</a>');
  }

  const isInstructor = email === instructorCredentials.email && password === instructorCredentials.password;

  // 🟢 لاگ گرفتن برای تست
  if (isInstructor) {
    console.log('🟢 ورود موفق: هنراموز', { email });
  } else {
    console.log('🟢 ورود موفق: هنرجو', { email, password });
  }

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

app.listen(PORT, () => {
  console.log(`✅ سرور اجرا شد روی http://localhost:${PORT}`);
});
