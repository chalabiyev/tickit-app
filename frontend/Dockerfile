FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_PUBLIC_API_URL=http://72.60.135.9:8080
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]