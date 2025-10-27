import axios from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { TokenMetadata } from '../types';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export class IPFSService {
  private apiKey: string;
  private secretKey: string;
  private jwt: string;

  constructor() {
    this.apiKey = config.pinata.apiKey;
    this.secretKey = config.pinata.secretKey;
    this.jwt = config.pinata.jwt;

    if (!this.jwt && (!this.apiKey || !this.secretKey)) {
      logger.warn('Pinata credentials not configured - IPFS functionality will be limited');
    }
  }

  private getHeaders(): Record<string, string> {
    if (this.jwt) {
      return {
        Authorization: `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      pinata_api_key: this.apiKey,
      pinata_secret_api_key: this.secretKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(data: TokenMetadata): Promise<string> {
    try {
      const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: {
            name: `${data.symbol}-metadata`,
          },
        },
        { headers: this.getHeaders() }
      );

      logger.info(`Metadata uploaded to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      logger.error('Error uploading JSON to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload file (image) to IPFS
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', file, filename);

      const metadata = JSON.stringify({
        name: filename,
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post<PinataResponse>(
        `${PINATA_API_URL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            ...formData.getHeaders(),
          },
        }
      );

      logger.info(`File uploaded to IPFS: ${response.data.IpfsHash}`);
      return response.data.IpfsHash;
    } catch (error) {
      logger.error('Error uploading file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Get metadata from IPFS hash
   */
  async getJSON(ipfsHash: string): Promise<TokenMetadata> {
    try {
      const response = await axios.get<TokenMetadata>(`${PINATA_GATEWAY_URL}/${ipfsHash}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching metadata from IPFS (${ipfsHash}):`, error);
      throw error;
    }
  }

  /**
   * Get gateway URL for IPFS hash
   */
  getGatewayUrl(ipfsHash: string): string {
    return `${PINATA_GATEWAY_URL}/${ipfsHash}`;
  }

  /**
   * Pin existing hash (for redundancy)
   */
  async pinByHash(ipfsHash: string, name?: string): Promise<void> {
    try {
      await axios.post(
        `${PINATA_API_URL}/pinning/pinByHash`,
        {
          hashToPin: ipfsHash,
          pinataMetadata: {
            name: name || ipfsHash,
          },
        },
        { headers: this.getHeaders() }
      );

      logger.info(`Pinned hash: ${ipfsHash}`);
    } catch (error) {
      logger.error(`Error pinning hash ${ipfsHash}:`, error);
      throw error;
    }
  }

  /**
   * Unpin hash (to save space/costs)
   */
  async unpin(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
        headers: this.getHeaders(),
      });

      logger.info(`Unpinned hash: ${ipfsHash}`);
    } catch (error) {
      logger.error(`Error unpinning hash ${ipfsHash}:`, error);
      throw error;
    }
  }

  /**
   * Test Pinata connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await axios.get(`${PINATA_API_URL}/data/testAuthentication`, {
        headers: this.getHeaders(),
      });
      logger.info('Pinata connection successful');
      return true;
    } catch (error) {
      logger.error('Pinata connection failed:', error);
      return false;
    }
  }
}

export const ipfsService = new IPFSService();
export default ipfsService;
