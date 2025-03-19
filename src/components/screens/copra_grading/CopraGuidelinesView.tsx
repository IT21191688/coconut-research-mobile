import React from 'react';
import { ScrollView, StyleSheet, Image } from 'react-native';
import { Card, Title, Paragraph, useTheme } from 'react-native-paper';

const CopraGuidelinesView = () => {
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.container}>
      {/* Grade 1 Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Grade 1 (Premium/First Grade)</Title>
          <Paragraph>Moisture Content: 6-8%</Paragraph>
          <Paragraph>Color: Creamy white to light brown</Paragraph>
          <Paragraph>Texture: Hard, dry, crisp</Paragraph>
          <Paragraph>Oil Content: 65-72%</Paragraph>
          <Paragraph>Uses: High-quality coconut oil production, food-grade applications</Paragraph>
          <Image source={require('../../../../assets/images/HomeSlide1.jpg')} style={styles.image} />
        </Card.Content>
      </Card>

      {/* Grade 2 Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Grade 2 (Standard/Second Grade)</Title>
          <Paragraph>Moisture Content: 8-10%</Paragraph>
          <Paragraph>Color: Light to medium brown</Paragraph>
          <Paragraph>Texture: Firm but not brittle</Paragraph>
          <Paragraph>Oil Content: 60-65%</Paragraph>
          <Paragraph>Uses: Regular coconut oil production, industrial applications</Paragraph>
          <Image source={require('../../../../assets/images/HomeSlide1.jpg')} style={styles.image} />
        </Card.Content>
      </Card>

      {/* Grade 3 Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Grade 3 (Commercial/Third Grade)</Title>
          <Paragraph>Moisture Content: 10-12%</Paragraph>
          <Paragraph>Color: Medium to dark brown</Paragraph>
          <Paragraph>Texture: Slightly harder</Paragraph>
          <Paragraph>Oil Content: 55-60%</Paragraph>
          <Paragraph>Uses: Lower grade oil production, industrial non-food applications</Paragraph>
          <Image source={require('../../../../assets/images/HomeSlide1.jpg')} style={styles.image} />
        </Card.Content>
      </Card>

      {/* Mold Identification Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Mold Identification Guide</Title>
          <Paragraph>Early Warning Signs:</Paragraph>
          <Paragraph>- Slight discoloration at edges</Paragraph>
          <Paragraph>- Faint musty smell</Paragraph>
          <Paragraph>- Moisture content above 12%</Paragraph>
          <Paragraph>- Small, isolated spots of white or gray growth</Paragraph>
          <Image source={require('../../../../assets/images/HomeSlide1.jpg')} style={styles.image} />
        </Card.Content>
      </Card>

      {/* Testing Methods Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Testing Methods</Title>
          <Paragraph>1. Check color uniformity</Paragraph>
          <Paragraph>2. Look for discoloration</Paragraph>
          <Paragraph>3. Examine for visible mold growth</Paragraph>
          <Paragraph>4. Assess overall appearance</Paragraph>
        </Card.Content>
      </Card>

      {/* Best Practices Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Best Practices</Title>
          <Paragraph>Storage Recommendations:</Paragraph>
          <Paragraph>- Store in dry, well-ventilated area</Paragraph>
          <Paragraph>- Keep away from direct sunlight</Paragraph>
          <Paragraph>- Use breathable packaging</Paragraph>
          <Paragraph>- Monitor moisture regularly</Paragraph>
          <Paragraph>- Maintain temperature below 27°C (80°F)</Paragraph>
          <Image source={require('../../../../assets/images/HomeSlide1.jpg')} style={styles.image} />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
    elevation: 3,
  },
  title: {
    color: '#333',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginTop: 8,
    borderRadius: 4,
  },
});

export default CopraGuidelinesView;