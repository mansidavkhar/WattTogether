# Use official Node.js image as base
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source code
COPY . .

# Expose port (matches app.listen port)
EXPOSE 8080

# Run the app
CMD ["node", "index.js"]
