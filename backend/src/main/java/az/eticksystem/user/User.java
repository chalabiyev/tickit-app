package az.eticksystem.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User implements UserDetails {

    @Id
    private String id;
    private String email;
    private String password;
    private String phone;

    @Builder.Default
    private String role = "ROLE_USER";

    // Личные данные
    private String fullName;
    private String firstName;
    private String lastName;
    private String avatarUrl;

    // Данные организации
    private String companyName;
    private String voen;
    private String legalAddress;
    private String responsiblePerson;
    private String extraContact;
    private String instagramUrl;
    private String websiteUrl;

    // Банковские данные
    private String iban;
    private String bankName;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override public String getUsername()              { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return true; }
}