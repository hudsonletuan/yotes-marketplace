# Yotes Marketplace - Node.js-Express.js-Vue.js-MongoDB Project

* Yotes Marketplace is a dynamic web application designed to facilitate the buying and selling of goods and services among users. Built with Vue 3 and TypeScript, it offers a user-friendly interface for managing posts, searching for items, and engaging in real-time chat with other users. This project showcases the power of Vue 3's Composition API and TypeScript's static typing for building scalable and maintainable web applications.
* This project is now built specifically for the College of Idaho community. Please attach the copyright and credits.

## Features

- **User Authentication**: Secure login and sign-up processes with OTP verification for new users.
- **Post Management**: Users can create, edit, and delete their posts, including media attachments and captions.
- **Real-time Chat**: Implemented using socket.IO, allowing users to message each other directly. (on development)
- **Search Functionality**: Users can search for posts based on various criteria such as username, caption, location, status, price, and date/time.
- **User-specific Posts**: Displays posts created by a specific user.
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
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   cd server
   npm run dev
   ```
5. Start the client:
   ```
   cd client
   npm run dev
   ```

### Deployment

Yotes Marketplace is deployed on an AWS EC2 Instance using Docker, AWS ECS, and AWS ECR. Follow the steps below to deploy your own instance:

1. **Dockerize the Application**: Ensure your application is containerized using Docker.
2. **Push to AWS ECR**: Create a repository in AWS ECR and push your Docker image.
3. **Deploy with AWS ECS**: Create a new ECS service and task definition, linking to your ECR repository.
4. **Configure AWS EC2 Instance**: Launch an EC2 instance and configure it to run your ECS service.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) before getting started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
