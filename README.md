# Kouprey E-Commerce Platform

Modern, full-featured e-commerce platform for fashion retail with comprehensive admin controls and real-time inventory management.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.20.0-green.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.20.0
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/vishnuprakash406/kouprey.git
cd kouprey

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 📦 Features

- **Customer Shopping**: Product catalog, cart, checkout, order tracking
- **Admin Dashboard**: User management, site configuration, system monitoring
- **Store Management**: Inventory control, order processing, product studio
- **Multi-Gateway Payments**: Stripe, PayPal, Razorpay, PayU ready
- **Communication Tools**: WhatsApp integration, social media links, email access
- **Modern UI**: Responsive design, loading animations, smooth transitions
- **Secure Authentication**: JWT-based multi-role system

---

## 🔑 Default Credentials

**Master Admin:**
- Email: `master@kouprey.com`
- Password: `ChangeMe123!`

**Store Staff:** Create via Master Admin Dashboard

⚠️ **IMPORTANT**: Change default credentials in production!

---

## 📚 Documentation

- **[Release Notes](RELEASE_NOTES.md)**: Complete feature list and technical details
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**: Cloudflare deployment instructions

---

## 🌐 Deployment

### Local Development
```bash
npm run dev
```

### Cloudflare Workers/Pages
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Deploy
npm run deploy
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (local), Cloudflare D1 (production)
- **Authentication**: JWT, bcryptjs
- **Frontend**: Vanilla JavaScript, Modern CSS
- **Storage**: Local filesystem (dev), Cloudflare R2 (prod)

---

## 📂 Project Structure

```
kouprey/
├── public/              # Frontend assets
│   ├── *.html          # HTML pages
│   ├── *.js            # Frontend JavaScript
│   ├── *.css           # Stylesheets
│   └── uploads/        # Product images/videos
├── server/             # Backend code
│   ├── index.js        # Express server
│   └── db.js           # Database layer
├── data/               # SQLite database
├── migrations/         # Database migrations
├── wrangler.toml       # Cloudflare config
├── package.json        # Dependencies
└── README.md          # This file
```

---

## 🔒 Security

- Change default master password
- Set strong `JWT_SECRET` in production
- Use environment variables for sensitive data
- Enable HTTPS (automatic on Cloudflare)
- Review API rate limits

---

## 📈 Performance

- **Loading Animations**: Professional spinners during data fetching
- **Client-Side Caching**: LocalStorage for cart and settings
- **Optimized Queries**: Efficient database operations
- **Static Asset Serving**: Fast delivery via CDN

---

## 🤝 Contributing

This is a proprietary project. For access or contributions, contact the repository owner.

---

## 📞 Support

- **WhatsApp**: +918438217212
- **GitHub**: https://github.com/vishnuprakash406/kouprey
- **Email**: Configure via admin dashboard

---

## 📝 License

Proprietary - All rights reserved to Kouprey brand.

---

## 🔄 Changelog

### v1.0.0 (February 19, 2026)
- ✨ Initial release
- ✨ Loading animations across all pages
- ✨ WhatsApp floating button integration
- ✨ Instagram/Facebook social links
- ✨ Store email access (Titan)
- ✨ Multi-payment gateway support
- ✨ Complete admin control panel
- ✨ Cloudflare deployment ready

---

**Built with ❤️ for modern e-commerce**
