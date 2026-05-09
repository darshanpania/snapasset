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
# Using `npm install --omit=dev` rather than `npm ci` because the committed
# lockfile drifts from package.json (vitest@^3 was added without a lockfile
# refresh). Switch back to `npm ci` once `npm install` has been run on a
# clean checkout and the updated server/package-lock.json is committed.
RUN npm install --omit=dev

# Copy app source
COPY . .

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Pre-create the local data dir so the named volume mounted at /usr/src/app/data
# inherits appuser ownership on first creation (otherwise the volume is
# root-owned and the non-root process can't mkdir inside it).
RUN mkdir -p /usr/src/app/data/storage /usr/src/app/logs
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

# Port (configurable, defaults to 3001)
ARG PORT=3001
ENV PORT=$PORT
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const p=process.env.PORT||3001;require('http').get('http://localhost:'+p+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Start server
CMD ["node", "index.js"]