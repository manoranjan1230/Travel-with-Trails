import { useParams } from 'wouter';
import { DetailPage } from './DetailPage';
export function TripDetailRoute(props: { wishlist: string[]; onWishlist: (id: string) => void }) { return <DetailPage {...props} />; }
