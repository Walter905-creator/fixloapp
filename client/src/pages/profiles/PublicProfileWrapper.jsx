import React from 'react';
import { useParams } from 'react-router-dom';
import PublicProfile from './PublicProfile';

export default function PublicProfileWrapper() {
  const { slug } = useParams();
  return <PublicProfile slug={slug} />;
}