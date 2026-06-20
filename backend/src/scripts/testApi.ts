import axios from 'axios';

const testApi = async () => {
  try {
    const response = await axios.post("http://127.0.0.1:8000/api/v1/login", {
      username: "student@gmail.com",
      password: "123"
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(response.status);
    console.log(response.data);
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

testApi();
