package transport

// Auth functions - JWT token management

func (c *Client) GetToken() string {
	return c.config.JWTToken
}

func (c *Client) SetToken(token string) {
	c.config.JWTToken = token
	// TODO: Save to config file
}
