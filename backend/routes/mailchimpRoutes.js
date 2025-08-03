import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

// Função para gerar o hash MD5 do e-mail, que é o identificador no Mailchimp
const generateSubscriberHash = (email) => {
  const lowercaseEmail = email.toLowerCase();
  return crypto.createHash('md5').update(lowercaseEmail).digest('hex');
};

// Nova Rota para checar o status de um e-mail (GET)
// Retorna um booleano indicando se o e-mail está inscrito
router.get('/subscribe-status', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório para verificar o status.' });
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const SERVER = process.env.MAILCHIMP_SERVER;

  if (!API_KEY || !LIST_ID || !SERVER) {
    return res.status(500).json({ message: 'Configuração do Mailchimp ausente no .env.' });
  }

  const subscriberHash = generateSubscriberHash(email);
  const url = `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
    });

    // A requisição foi bem-sucedida, o membro existe na lista
    return res.status(200).json({ isSubscribed: true });
  } catch (error) {
    // Se o status for 404, o membro não existe
    if (error.response && error.response.status === 404) {
      return res.status(200).json({ isSubscribed: false });
    }
    // Outro tipo de erro
    console.error('Erro ao verificar status de e-mail:', error.response?.data?.detail || error.message);
    return res.status(500).json({ message: 'Erro ao verificar o status do e-mail.' });
  }
});

// Rota de Inscrição (POST)
// Adiciona um novo membro à lista de e-mails
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório.' });
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const SERVER = process.env.MAILCHIMP_SERVER;

  if (!API_KEY || !LIST_ID || !SERVER) {
    return res.status(500).json({ message: 'Configuração do Mailchimp ausente no .env.' });
  }

  const url = `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;

  try {
    await axios.post(
      url,
      {
        email_address: email,
        status: 'subscribed',
      },
      {
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json({ message: 'Inscrição realizada com sucesso!' });
  } catch (error) {
    const errorMsg =
      error?.response?.data?.detail || 'Erro ao se inscrever na lista do Mailchimp.';
    return res.status(400).json({ message: errorMsg });
  }
});

// Rota de Desinscrição (DELETE)
// Remove um membro da lista de e-mails
router.delete('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-mail é obrigatório para cancelar a assinatura.' });
  }

  const API_KEY = process.env.MAILCHIMP_API_KEY;
  const LIST_ID = process.env.MAILCHIMP_LIST_ID;
  const SERVER = process.env.MAILCHIMP_SERVER;

  if (!API_KEY || !LIST_ID || !SERVER) {
    return res.status(500).json({ message: 'Configuração do Mailchimp ausente no .env.' });
  }

  const subscriberHash = generateSubscriberHash(email);
  const url = `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`;

  try {
    await axios.delete(url, {
      headers: {
        Authorization: `apikey ${API_KEY}`,
      },
    });

    return res.status(200).json({ message: 'Assinatura cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error.response?.data?.detail);
    const errorMsg =
      error?.response?.data?.detail || 'Erro ao cancelar sua assinatura.';
    return res.status(400).json({ message: errorMsg });
  }
});

export default router;
