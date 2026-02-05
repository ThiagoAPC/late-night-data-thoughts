FROM node:20-alpine

WORKDIR /app

# Instalar git para o Docusaurus
RUN apk add --no-cache git

# Expor porta do dev server
EXPOSE 3000

# Comando padrão
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
