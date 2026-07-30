import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/tables/EmptyState";
import { PhotoThumbnail } from "@/components/tables/PhotoThumbnail";
import { GroupRowActions } from "@/features/groups/components/GroupRowActions";
import type { Group } from "@/types/group";

export function GroupsTable({ groups }: { groups: Group[] }) {
  if (groups.length === 0) {
    return (
      <EmptyState
        title="No groups yet"
        description="Create a main group to get started."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-px">
            <span className="sr-only">Photo</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-px">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <TableRow key={group.id}>
            <TableCell>
              <PhotoThumbnail url={group.photo_url} alt={`${group.name} photo`} />
            </TableCell>
            <TableCell className="font-medium">{group.name}</TableCell>
            <TableCell>
              <GroupRowActions group={group} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
