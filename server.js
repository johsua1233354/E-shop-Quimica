const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

app.get('/api/debug/health', (req, res) => {
    try {
        const logPath = path.join(__dirname, '.dbg', 'trae-debug-log-login-cart-failure.ndjson');
        let count = 0;
        if (fs.existsSync(logPath)) {
            const raw = fs.readFileSync(logPath, 'utf8');
            count = raw.split('\n').filter(Boolean).length;
        }
        res.json({ ok: true, sessionId: 'login-cart-failure', logCount: count });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.post('/api/debug/event', (req, res) => {
    try {
        const outDir = path.join(__dirname, '.dbg');
        fs.mkdirSync(outDir, { recursive: true });
        const logPath = path.join(outDir, 'trae-debug-log-login-cart-failure.ndjson');
        const payload = { ts: Date.now(), ...req.body };
        fs.appendFileSync(logPath, JSON.stringify(payload) + '\n', 'utf8');
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

const dbConfig = {
    server: 'localhost',
    database: 'EshopQuimica',
    user: 'sa',
    password: 'TuContraseña123!',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function connectToDB() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to Microsoft SQL Server');
        await initDatabase();
    } catch (err) {
        console.error('Error connecting to SQL Server:', err.message);
        console.log('\nPor favor, sigue estos pasos:');
        console.log('1. Instala Microsoft SQL Server (Download from https://www.microsoft.com/sql-server)');
        console.log('2. Crea la base de datos "EshopQuimica"');
        console.log('3. Configura tu usuario y contraseña en dbConfig dentro de server.js');
    }
}

async function initDatabase() {
    try {
        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
            CREATE TABLE users (
                id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                email NVARCHAR(255) UNIQUE NOT NULL,
                username NVARCHAR(255) UNIQUE NOT NULL,
                password NVARCHAR(255) NOT NULL
            )
        `);

        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[purchases]') AND type in (N'U'))
            CREATE TABLE purchases (
                id INT IDENTITY(1,1) PRIMARY KEY,
                userId INT NOT NULL,
                date DATETIME NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id)
            )
        `);

        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[purchase_items]') AND type in (N'U'))
            CREATE TABLE purchase_items (
                id INT IDENTITY(1,1) PRIMARY KEY,
                purchaseId INT NOT NULL,
                productId INT NOT NULL,
                productName NVARCHAR(255) NOT NULL,
                productEmoji NVARCHAR(10) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (purchaseId) REFERENCES purchases(id)
            )
        `);

        await sql.query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cart]') AND type in (N'U'))
            CREATE TABLE cart (
                id INT IDENTITY(1,1) PRIMARY KEY,
                userId INT NOT NULL,
                productId INT NOT NULL,
                productName NVARCHAR(255) NOT NULL,
                productEmoji NVARCHAR(10) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL DEFAULT 1,
                FOREIGN KEY (userId) REFERENCES users(id),
                CONSTRAINT UC_UserProduct UNIQUE(userId, productId)
            )
        `);

        const checkUsers = await sql.query('SELECT COUNT(*) AS count FROM users');
        if (checkUsers.recordset[0].count === 0) {
            await sql.query(`
                INSERT INTO users (name, email, username, password) VALUES
                ('Administrador', 'admin@eshopquimica.com', 'admin', 'admin123'),
                ('Usuario Demo', 'demo@eshopquimica.com', 'usuario', '123456')
            `);
        }

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err.message);
    }
}

app.get('/api/users', async (req, res) => {
    try {
        const result = await sql.query('SELECT * FROM users');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await sql.query(`
            SELECT * FROM users WHERE (username = '${username}' OR email = '${username}') AND password = '${password}'
        `);
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/register', async (req, res) => {
    const { name, email, username, password } = req.body;
    try {
        const result = await sql.query(`
            INSERT INTO users (name, email, username, password)
            VALUES ('${name}', '${email}', '${username}', '${password}');
            SELECT SCOPE_IDENTITY() AS id;
        `);
        res.json({ id: result.recordset[0].id, name, email, username });
    } catch (err) {
        if (err.message.includes('UNIQUE') || err.message.includes('duplicate')) {
            res.status(400).json({ error: 'User or email already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.get('/api/cart/:userId', async (req, res) => {
    try {
        const result = await sql.query(`SELECT * FROM cart WHERE userId = ${req.params.userId}`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/cart', async (req, res) => {
    const { userId, productId, productName, productEmoji, price, quantity } = req.body;
    try {
        const check = await sql.query(`SELECT * FROM cart WHERE userId = ${userId} AND productId = ${productId}`);
        if (check.recordset.length > 0) {
            await sql.query(`
                UPDATE cart SET quantity = quantity + ${quantity || 1} WHERE id = ${check.recordset[0].id}
            `);
        } else {
            await sql.query(`
                INSERT INTO cart (userId, productId, productName, productEmoji, price, quantity)
                VALUES (${userId}, ${productId}, '${productName}', '${productEmoji}', ${price}, ${quantity || 1})
            `);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/cart/:id', async (req, res) => {
    const { quantity } = req.body;
    try {
        await sql.query(`UPDATE cart SET quantity = ${quantity} WHERE id = ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/cart/:id', async (req, res) => {
    try {
        await sql.query(`DELETE FROM cart WHERE id = ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/cart/user/:userId', async (req, res) => {
    try {
        await sql.query(`DELETE FROM cart WHERE userId = ${req.params.userId}`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/purchases/:userId', async (req, res) => {
    try {
        const purchasesResult = await sql.query(`
            SELECT * FROM purchases WHERE userId = ${req.params.userId} ORDER BY id DESC
        `);
        const purchases = purchasesResult.recordset;
        
        for (let purchase of purchases) {
            const itemsResult = await sql.query(`
                SELECT * FROM purchase_items WHERE purchaseId = ${purchase.id}
            `);
            purchase.items = itemsResult.recordset;
        }
        
        res.json(purchases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/purchases', async (req, res) => {
    const { userId, items, total } = req.body;
    const date = new Date().toISOString();
    
    try {
        const purchaseResult = await sql.query(`
            INSERT INTO purchases (userId, date, total)
            VALUES (${userId}, '${date}', ${total});
            SELECT SCOPE_IDENTITY() AS id;
        `);
        const purchaseId = purchaseResult.recordset[0].id;
        
        for (let item of items) {
            await sql.query(`
                INSERT INTO purchase_items (purchaseId, productId, productName, productEmoji, price, quantity)
                VALUES (${purchaseId}, ${item.id}, '${item.name}', '${item.emoji}', ${item.price}, ${item.quantity})
            `);
        }
        
        await sql.query(`DELETE FROM cart WHERE userId = ${userId}`);
        
        res.json({ id: purchaseId, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

connectToDB();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
