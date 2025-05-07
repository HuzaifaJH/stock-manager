# Stock Manager

Stock Manager is a powerful inventory and stock management application built with **Next.js, Electron, and MySQL**. This project can run as a web application or a desktop application, making it a versatile solution for managing inventory efficiently.

Live Demo: http://18.139.84.189

## Features

- 📦 **Inventory Management** – Track and manage stock levels easily.
- 🖥️ **Desktop & Web Support** – Run as a web app or a desktop application.
- ⚡ **Fast & Responsive** – Built with Next.js for optimized performance.
- 🌙 **Dark Mode Support** – Switch between light and dark themes.

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS Recommended)
- [npm](https://www.npmjs.com/) (Included with Node.js)
- [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) (For local database setup)

### Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/HuzaifaJH/stock-manager.git
   cd stock-manager
   ```

2. **Install Dependencies**

   ```sh
   npm install
   ```

3. **Set Up Environment Variables** Create a `.env` file in the root directory and add your database credentials:

   ```env
   DB_NAME=ims
   DB_USER=root
   DB_PASS=root
   DB_HOST=localhost
   DB_PORT=3306
   NEXT_PUBLIC_API_URL=http://localhost:5353
   ```

### Running the Application

#### Development Mode

Run the project in development mode:

```sh
npm run dev
```

This starts the app at `http://localhost:3000` with hot reloading.

#### Production Build

Generate a production build:

```sh
npm run build
```

Then start the production server:

```sh
npm start
```

#### Electron Desktop Application

To build the **Electron** version of the app:

```sh
npm run electron-build
```

This generates an installer for your desktop application.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Feel free to open issues or submit pull requests. Contributions are welcome!

## License

This project is licensed under the **MIT License**.

---

Happy Coding! 🚀
