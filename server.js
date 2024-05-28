const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// Создание экземпляра приложения Express
const app = express();

// Обработчик для GET запроса на корневой URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Создание HTTP сервера с использованием приложения Express
const server = http.createServer(app);
const io = socketIo(server);

// Подключение к MongoDB
mongoose.connect('mongodb://localhost/chatApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const messageSchema = new mongoose.Schema({
    text: String,
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

// Подключение сокетов
io.on('connection', async (socket) => {
    console.log('Новый пользователь подключен');

    // Отправка старых сообщений пользователю при подключении
    try {
        const messages = await Message.find().exec();
        socket.emit('init', messages);
    } catch (err) {
        console.error('Ошибка при получении сообщений:', err);
    }

    // Обработка новых сообщений
    socket.on('message', async (data) => {
        const { text } = data;
        const message = new Message({ text });
        try {
            await message.save();
            io.emit('message', message);
        } catch (err) {
            console.error('Ошибка при сохранении сообщения:', err);
        }
    });

    // Обработка отключения пользователя
    socket.on('disconnect', () => {
        console.log('Пользователь отключился');
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
