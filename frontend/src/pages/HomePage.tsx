import { Link } from 'react-router-dom';
import { Button, Container, Typography, Box } from '@mui/material';

function HomePage() {
  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Developer Portfolio
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Welcome to my portfolio. Check out my projects below.
        </Typography>
        <Button component={Link} to="/dps-calculator" variant="contained" color="primary">
          ScapeMate
        </Button>
      </Box>
    </Container>
  );
}

export default HomePage;
