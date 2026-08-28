export default class CustomAPIError extends Error {
  statusCode!: number;
}
