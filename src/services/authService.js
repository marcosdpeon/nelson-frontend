import jwtDecode from 'jwt-decode';
import axios from '../utils/axios';
import { API_HOST } from '../config/api.config';

class AuthService {
  setAxiosInterceptors = ({ onLogout }) => {
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          this.setSession(null);

          if (onLogout) {
            onLogout();
          }
        }

        return Promise.reject(error);
      }
    );
  };

  handleAuthentication() {
    const accessToken = this.getAccessToken();

    if (!accessToken) {
      return;
    }

    if (this.isValidToken(accessToken)) {
      this.setSession(accessToken);
    } else {
      this.setSession(null);
    }
  }

  loginWithNameAndPassword = (name, password) => new Promise((resolve, reject) => {
    axios.post(`${API_HOST}/api/signin`, { name, password })
      .then((response) => {
        if (response.data.user) {
          this.setSession(response.data.accessToken);
          resolve(response.data.user);
        } else {
          reject(response.data.error);
        }
      })
      .catch((error) => {
        throw error;
      });
  })

  loginInWithToken = () => new Promise((resolve, reject) => {
    axios.post(`${API_HOST}/api/account/me`)
      .then((response) => {
        if (response.data.user) {
          resolve(response.data.user);
        } else {
          reject(null);
        }
      })
      .catch((error) => {
        resolve(null);
      });
  })

  logout = () => {
    this.setSession(null);
  }

  register = (firstname, lastname, email, password) => new Promise((resolve, reject) => {
    axios.post(`${API_HOST}/api/signup`, {
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password
    })
      .then((response) => {
        if (response.data.user) {
          resolve(response.data.user);
        } else {
          reject(response.data.error);
        }
      })
      .catch((error) => {
        reject(error);
      });
  })

  setSession = (accessToken) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      localStorage.removeItem('accessToken');
      delete axios.defaults.headers.common.Authorization;
    }
  }

  getAccessToken = () => localStorage.getItem('accessToken');

  isValidToken = (accessToken) => {
    if (!accessToken) {
      return false;
    }

    const decoded = jwtDecode(accessToken);
    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  }

  isAuthenticated = () => !!this.getAccessToken()
}

const authService = new AuthService();

export default authService;