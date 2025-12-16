FROM node:20-alpine

WORKDIR /app

COPY RoblexLandingPage/package*.json ./
RUN npm install

COPY RoblexLandingPage/ ./

EXPOSE 3000

CMD ["npm", "start"]
