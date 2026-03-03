const axios = require("axios");

const services = [
  "https://growthsheet-payment.onrender.com/",
  "https://growthsheet-backend-2uml.onrender.com/",
  "https://growthsheet-backend-auth.onrender.com/",
  "https://growthsheet-backend-product-crvc.onrender.com/",
  "https://growthsheet-backend-gateway.onrender.com/"
];

const checkServices = async () => {
  console.log("Running health check:", new Date().toLocaleString());

  for (const url of services) {
    try {
      const res = await axios.get(url);
      console.log(` ${url} -> ${res.status}`);
    } catch (err) {
      console.log(` ${url} -> ERROR: ${err.message}`);
    }
  }

  console.log("--------------------------------------------------");
};

checkServices();

setInterval(checkServices, 2 * 60 * 1000);
