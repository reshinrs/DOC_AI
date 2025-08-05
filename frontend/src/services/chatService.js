import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chat';

/**
 * Sends a message to the chatbot backend.
 * @param {string} message The user's message.
 * @returns {Promise<axios.AxiosResponse<any>>} The axios response promise.
 */
const sendMessage = (message) => {
  return axios.post(API_URL, { message });
};

const chatService = {
  sendMessage,
};

export default chatService;