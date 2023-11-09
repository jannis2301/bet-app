import { Link } from 'react-router-dom'
import img from '../assets/images/not-found.svg'

const Error = () => {
  return (
    <section class="error-page-box">
      <img class="error-page-img" src={img} alt="not found" />
      <h3>Ohh! page not found</h3>
      <p>We can't seem to find the page you are looking for</p>
      <Link className="btn" to="/">
        back home
      </Link>
    </section>
  )
}
export default Error
