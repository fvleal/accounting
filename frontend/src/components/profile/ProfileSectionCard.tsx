import React from "react";
import { Card, CardContent, Divider, Typography } from "@mui/material";

interface ProfileSectionCardProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileSectionCard({
  title,
  children,
}: ProfileSectionCardProps) {
  const items = React.Children.toArray(children);

  return (
    <Card sx={{ mb: 2, borderRadius: { xs: 0, sm: 1 } }}>
      <CardContent>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider />}
            {child}
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  );
}
