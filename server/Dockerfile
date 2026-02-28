FROM node:20-alpine

# Install system dependencies for Sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Port (configurable, defaults to 3001)
ARG PORT=3001
ENV PORT=$PORT
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const p=process.env.PORT||3001;require('http').get('http://localhost:'+p+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Start server
CMD ["node", "index.js"]