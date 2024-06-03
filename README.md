# Yotes Marketplace - Node.js-Express.js-Vue.js-MongoDB Project

* Yotes Marketplace is a social media dynamic web application designed to facilitate the buying and selling of goods and services among users. Built with Vue 3 and Node.js (TypeScript), it offers a user-friendly interface for managing posts, searching for items, and engaging in real-time chat with other users. This project showcases the power of Vue 3's Composition API and TypeScript's static typing for building scalable and maintainable web applications.

## Features

- **User Authentication**: Secure login and sign-up processes with email OTP verification for new users.
- **Post Management**: Users can create, edit, delete, and share their posts, including media attachments and captions.
- **Real-time Chat**: Implemented using Socket.IO, allowing users to message each other directly, see each other online/offline status, see messages' seen/unseen status, and see notifications of new messages.
- **Image/Video Compressor: Image and video files are automatically compressed when posting or sending messages for storage and bandwidth optimization. Image and video files are uploaded to Cloudflare R2 bucket (used to use AWS S3 bucket but then switched for cost optimization) using AWS-SDK S3.
- **Search Functionality**: Users can search for posts based on various criteria such as username, caption, location, status, price, and date/time.
- **User-specific/Chat-specific Posts**: Displays posts created by a specific user or post of a chat.
- **Responsive Design: Responsive design is applicable to most modern devices, allows users to access and experience the web application on any device.
- **Accessibility and Performance**: Designed with accessibility in mind and optimized for performance.

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)
- Vue CLI (v4.x or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/hudsonletuan/yotes-marketplace.git
   ```
2. Navigate to the project directory:
   ```
   cd yotes-marketplace
   ```
3. Install dependencies and start the server side (backend):
   ```
   cd server
   npm install
   npm run dev
   ```
4. Install dependencies and start the client side (frontend):
   ```
   cd client
   npm install
   npm run dev
   ```

### Deployment

Yotes Marketplace is deployed on an AWS EC2 Instance using Docker, AWS ECS, and DockerHub (used to use AWS ECR but then switched). Follow the steps below to deploy your own instance:

1. **Dockerize the Application**: Ensure your application is containerized using Docker.
2. **Push to DockerHub**: Create a repository in DockerHub and push your Docker image.
3. **Deploy with AWS ECS**: Create a new ECS service and task definition, linking to your Docker image URI.
4. **Configure AWS EC2 Instance**: Configure security and routing settings before launching an EC2 instance to run your ECS service.

## Contributing

Contributions are welcome!

## License

This project is now built specifically for the College of Idaho community. Please attach the copyright and credits.
