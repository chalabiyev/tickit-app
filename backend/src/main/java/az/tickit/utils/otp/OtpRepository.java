package az.tickit.utils.otp;

import az.tickit.utils.otp.OtpCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpRepository extends MongoRepository<OtpCode, String> {
    // Spring сам поймет, как искать по ID (email)
}
