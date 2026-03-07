package az.eticksystem.utils.otp;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpRepository extends MongoRepository<OtpCode, String> {
}