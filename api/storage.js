// Simple in-memory storage that both functions can access
const paidUsers = new Map();

module.exports = {
  setPaidUser: (userId, data) => {
    console.log('Storing payment for user:', userId, data);
    paidUsers.set(userId, data);
  },
  
  getPaidUser: (userId) => {
    const data = paidUsers.get(userId);
    console.log('Retrieved payment for user:', userId, data);
    return data;
  },
  
  getAllUsers: () => {
    console.log('All stored users:', Array.from(paidUsers.keys()));
    return paidUsers;
  }
};